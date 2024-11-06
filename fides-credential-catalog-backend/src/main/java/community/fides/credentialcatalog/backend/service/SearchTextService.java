package community.fides.credentialcatalog.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import community.fides.credentialcatalog.backend.service.openidissuance.dto.DisplayProperties;
import community.fides.credentialcatalog.backend.service.openidissuance.dto.OpenIDProviderMetadata;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
@Slf4j
public class SearchTextService {

    private final ObjectMapper objectMapper;

    public String buildSearchText(String issuanceContent, final String credentialConfigurationId) {
        try {
            List<String> searchFields = new ArrayList<>();
            searchFields.addAll(createIssuerFields(issuanceContent));
            searchFields.addAll(getAllCredentialTypeDisplayNames(issuanceContent, credentialConfigurationId));
            searchFields.addAll(getAllCredentialTypeAttributeNames(issuanceContent, credentialConfigurationId));
            searchFields.addAll(getAllCredentialTypeAttributeDisplayNames(issuanceContent, credentialConfigurationId));
            return searchFields.stream()
                    .distinct()
                    .filter(s -> s != null)
                    .collect(Collectors.joining(" "));
        } catch (Exception e) {
            return issuanceContent;
        }
    }

    @SneakyThrows
    private Collection<String> createIssuerFields(final String configurationContent) {
        final OpenIDProviderMetadata openIDProviderMetadata = objectMapper.readValue(configurationContent, OpenIDProviderMetadata.class);
        return openIDProviderMetadata.getDisplay().stream()
                .flatMap(displayProperty -> getDisplayPropertyNames(displayProperty).stream())
                .distinct()
                .toList();
    }


    @SneakyThrows
    private Collection<String> getAllCredentialTypeDisplayNames(final String configurationContent, final String credentialConfigurationId) {
        final OpenIDProviderMetadata openIDProviderMetadata = objectMapper.readValue(configurationContent, OpenIDProviderMetadata.class);
        return openIDProviderMetadata.getCredentialConfigurationsSupported().entrySet().stream()
                .filter(entry -> entry.getKey().equalsIgnoreCase(credentialConfigurationId))
                .map(entry -> entry.getValue().getDisplay())
                .flatMap(displayProperties -> displayProperties.stream()
                        .flatMap(displayProperty -> getDisplayPropertyNames(displayProperty).stream())
                        .distinct())
                .toList();

    }

    @SneakyThrows
    private Collection<String> getAllCredentialTypeAttributeNames(final String configurationContent, final String credentialConfigurationId) {
        final OpenIDProviderMetadata openIDProviderMetadata = objectMapper.readValue(configurationContent, OpenIDProviderMetadata.class);
        return openIDProviderMetadata.getCredentialConfigurationsSupported().entrySet().stream()
                .filter(entry -> entry.getKey().equalsIgnoreCase(credentialConfigurationId))
                .map(entry -> entry.getValue().getCredentialDefinition().getCredentialSubject())
                .filter(entry -> entry != null)
                .flatMap(entry -> entry.entrySet().stream())
                .map(entry -> entry.getKey())
                .distinct()
                .toList();

    }

    @SneakyThrows
    private Collection<String> getAllCredentialTypeAttributeDisplayNames(final String configurationContent, final String credentialConfigurationId) {
        final OpenIDProviderMetadata openIDProviderMetadata = objectMapper.readValue(configurationContent, OpenIDProviderMetadata.class);
        return openIDProviderMetadata.getCredentialConfigurationsSupported().entrySet().stream()
                .filter(entry -> entry.getKey().equalsIgnoreCase(credentialConfigurationId))
                .map(entry -> entry.getValue().getCredentialDefinition().getCredentialSubject())
                .filter(entry -> entry != null)
                .flatMap(entry -> entry.entrySet().stream())
                .flatMap(entry -> entry.getValue().getDisplay().stream())
                .flatMap(displayProperty -> getDisplayPropertyNames(displayProperty).stream())
                .distinct()
                .toList();

    }

    private List<String> getDisplayPropertyNames(final DisplayProperties displayProperty) {
        List<String> result = new ArrayList<>();
        result.add(displayProperty.getName());
        result.add(displayProperty.getDescription());
        return result;
    }

}
