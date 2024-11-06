package community.fides.credentialcatalog.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import community.fides.credentialcatalog.backend.domain.CredentialKind;
import community.fides.credentialcatalog.backend.domain.FormToJpaCollectionMerger;
import community.fides.credentialcatalog.backend.domain.IssuanceConfig;
import community.fides.credentialcatalog.backend.domain.IssuanceConfigCredentialType;
import community.fides.credentialcatalog.backend.repository.IssuanceConfigRepository;
import community.fides.credentialcatalog.backend.service.openidissuance.dto.CredentialConfigurationSupported;
import community.fides.credentialcatalog.backend.service.openidissuance.dto.DisplayProperties;
import community.fides.credentialcatalog.backend.service.openidissuance.dto.OpenIDProviderMetadata;
import community.fides.credentialcatalog.backend.utils.EqualUtils;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class IssuanceConfigContentUpdater {

    private final IssuanceConfigRepository issuanceConfigRepository;
    private final ObjectMapper objectMapper;
    private final SearchTextService searchTextService;
    private final FormToJpaCollectionMerger<IssuanceConfigCredentialType, IssuanceConfigCredentialType> issuanceConfigMerger = new FormToJpaCollectionMerger<>();

    @Async
    @Transactional
    public void retrieveAndStoreIssuanceContentAndUpdateCredentialTypesAsync(Long issuanceConfigId) {
        retrieveAndStoreIssuanceContentAndUpdateCredentialTypes(issuanceConfigId);
    }

    @Transactional
    public IssuanceConfig retrieveAndStoreIssuanceContentAndUpdateCredentialTypes(Long issuanceConfigId) {
        var issuanceConfigCurrentOpt = issuanceConfigRepository.findById(issuanceConfigId);
        if (issuanceConfigCurrentOpt.isEmpty()) {
            log.error("IssuanceConfig not found with id: {}", issuanceConfigId);
            return null;
        }
        var issuanceConfigCurrent = issuanceConfigCurrentOpt.get();
        final IssuanceConfig issuanceConfigUpdates = retrieveIssuanceContentAndUpdateCredentialTypes(issuanceConfigCurrent.getIssuanceUrl());
        issuanceConfigCurrent.setIssuanceContent(issuanceConfigUpdates.getIssuanceContent());
        issuanceConfigCurrent.setGrantTypesSupported(issuanceConfigUpdates.getGrantTypesSupported());
        issuanceConfigCurrent.setIssuerDisplayLocale(issuanceConfigUpdates.getIssuerDisplayLocale());
        issuanceConfigMerger.buildJpaCollection(
                issuanceConfigUpdates.getCredentialTypes(),
                issuanceConfigCurrent.getCredentialTypes(),
                (credentialTypeUpdate, credentialTypeCurrent) -> EqualUtils.equals(credentialTypeUpdate.getCredentialConfigurationId(), credentialTypeCurrent.getCredentialConfigurationId()),
                (form, entity) -> {
                    entity.setCredentialConfigurationId(form.getCredentialConfigurationId());
                    entity.setIssuanceConfig(issuanceConfigCurrent);
                    entity.setCredentialFormat(form.getCredentialFormat());
                    entity.setCryptographicBindingMethodsSupported(form.getCryptographicBindingMethodsSupported());
                    entity.setCredentialSigningAlgValuesSupported(form.getCredentialSigningAlgValuesSupported());
                    entity.setLocale(form.getLocale());
                    entity.setSearchData(searchTextService.buildSearchText(issuanceConfigUpdates.getIssuanceContent(), form.getCredentialConfigurationId()));
                    return entity;
                },
                (form) -> {
                    var entity = new IssuanceConfigCredentialType();
                    entity.setCredentialConfigurationId(form.getCredentialConfigurationId());
                    entity.setIssuanceConfig(issuanceConfigCurrent);
                    entity.setCredentialKind(CredentialKind.UNKNOWN);
                    entity.setCredentialFormat(form.getCredentialFormat());
                    entity.setCryptographicBindingMethodsSupported(form.getCryptographicBindingMethodsSupported());
                    entity.setCredentialSigningAlgValuesSupported(form.getCredentialSigningAlgValuesSupported());
                    entity.setLocale(form.getLocale());
                    entity.setSearchData(searchTextService.buildSearchText(issuanceConfigUpdates.getIssuanceContent(), form.getCredentialConfigurationId()));
                    return entity;
                });
        return issuanceConfigRepository.save(issuanceConfigCurrent);
    }

    @SneakyThrows
    public IssuanceConfig retrieveIssuanceContentAndUpdateCredentialTypes(String issuanceUrl) {
        IssuanceConfig issuanceConfig = new IssuanceConfig();
        final String issuanceContent = retrieveIssuanceContent(issuanceUrl);
        final OpenIDProviderMetadata openIDProviderMetadata = objectMapper.readValue(issuanceContent, OpenIDProviderMetadata.class);
        issuanceConfig.setIssuanceContent(issuanceContent);
        issuanceConfig.setIssuanceUrl(issuanceUrl);
        issuanceConfig.setGrantTypesSupported(openIDProviderMetadata.getGrantTypesSupported());
        issuanceConfig.setCredentialTypes(buildCredentialTypes(issuanceConfig, issuanceContent, openIDProviderMetadata));
        if (openIDProviderMetadata.getDisplay() != null) {
            issuanceConfig.setIssuerDisplayLocale(openIDProviderMetadata.getDisplay().stream()
                                                          .map(DisplayProperties::getLocale)
                                                          .filter(Objects::nonNull)
                                                          .distinct()
                                                          .collect(Collectors.toCollection(ArrayList::new)));
        }
        return issuanceConfig;
    }

    @SneakyThrows
    private List<IssuanceConfigCredentialType> buildCredentialTypes(final IssuanceConfig issuanceConfig, final String issuanceContent, final OpenIDProviderMetadata openIDProviderMetadata) {
        if (openIDProviderMetadata.getCredentialConfigurationsSupported() == null) {
            log.info("No credential configurations supported found in issuer configuration content: {}", issuanceContent);
            return List.of();
        }
        return openIDProviderMetadata.getCredentialConfigurationsSupported().entrySet().stream()
                .map(entry -> IssuanceConfigCredentialType.builder()
                        .issuanceConfig(issuanceConfig)
                        .credentialConfigurationId(entry.getKey())
                        .credentialFormat(entry.getValue().getFormat())
                        .cryptographicBindingMethodsSupported(entry.getValue().getCryptographicBindingMethodsSupported())
                        .credentialSigningAlgValuesSupported(entry.getValue().getCredentialSigningAlgValuesSupported())
                        .locale(getLocales(entry.getValue()))
                        .build())
                .toList();

    }


    private List<String> getLocales(final CredentialConfigurationSupported credentialConfigurationSupported) {
        if (credentialConfigurationSupported.getDisplay() == null) {
            return new ArrayList<>();
        }
        return credentialConfigurationSupported.getDisplay().stream()
                .map(DisplayProperties::getLocale)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toCollection(ArrayList::new));
    }

    public String retrieveIssuanceContent(String issuanceUrl) {
        final RestTemplate restTemplate = new RestTemplate();
        return restTemplate.getForObject(issuanceUrl, String.class);
    }

}
