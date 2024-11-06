package community.fides.credentialcatalog.backend.rest.webpublic;

import community.fides.credentialcatalog.backend.configuration.security.LocalPrincipal;
import community.fides.credentialcatalog.backend.domain.CredentialKind;
import community.fides.credentialcatalog.backend.domain.DeploymentEnvironment;
import community.fides.credentialcatalog.backend.domain.IssuanceConfigCredentialType;
import community.fides.credentialcatalog.backend.rest.webpublic.dto.CredentialTypeDto;
import community.fides.credentialcatalog.backend.service.IssuanceConfigCredentialTypePublicSearchService;
import community.fides.credentialcatalog.backend.service.OpenIDProviderMetadataService;
import community.fides.credentialcatalog.backend.service.openidissuance.dto.DisplayProperties;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedModel;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController()
@RequestMapping("/api/webpublic/credentialType")
@Slf4j
@RequiredArgsConstructor
@PreAuthorize("permitAll()")
public class CredentialTypeController {

    private final IssuanceConfigCredentialTypePublicSearchService issuanceConfigCredentialTypePublicSearchService;
    private final OpenIDProviderMetadataService openIDProviderMetadataService;

    @GetMapping
    public PagedModel<CredentialTypeDto> find(LocalPrincipal principal,
                                              @RequestParam(value = "q", required = false, defaultValue = "") String searchText,
                                              @RequestParam(value = "locale", required = false, defaultValue = "nl-NL") String locale,
                                              @RequestParam Optional<List<CredentialKind>> credentialKind,
                                              @RequestParam Optional<List<DeploymentEnvironment>> deploymentEnvironment,
                                              @RequestParam Optional<List<String>> grantTypesSupported,
                                              @RequestParam Optional<List<String>> credentialFormat,
                                              @RequestParam Optional<List<String>> cryptographicBindingMethodsSupported,
                                              @RequestParam Optional<List<String>> credentialSigningAlgValuesSupported,
                                              @RequestParam Optional<List<String>> localeSupported,
                                              Pageable pageable) {
        final Page<IssuanceConfigCredentialType> items = issuanceConfigCredentialTypePublicSearchService.findAllPublic(searchText,
                                                                                                                       grantTypesSupported,
                                                                                                                       credentialFormat,
                                                                                                                       credentialKind,
                                                                                                                       cryptographicBindingMethodsSupported,
                                                                                                                       deploymentEnvironment,
                                                                                                                       credentialSigningAlgValuesSupported,
                                                                                                                       localeSupported,
                                                                                                                       pageable);
        return new PagedModel(items.map(credentialType -> toDto(credentialType, locale)));

    }

    @GetMapping("/{id}")
    public CredentialTypeDto get(LocalPrincipal principal, @PathVariable Long id, @RequestParam(value = "locale", required = false, defaultValue = "nl-NL") String locale) {
        return toDto(issuanceConfigCredentialTypePublicSearchService.findById(principal, id).orElseThrow(() -> new IllegalArgumentException("Credential type not found")), locale);
    }

    private CredentialTypeDto toDto(final IssuanceConfigCredentialType credentialType, final String locale) {
        var openIDProviderMetadata = openIDProviderMetadataService.getOpenIDProviderMetadata(credentialType.getIssuanceConfig().getIssuanceContent());
        final DisplayProperties issuerDisplay = openIDProviderMetadataService.getIssuerDisplayPropertiesByLocale(openIDProviderMetadata, locale).orElse(null);
        final DisplayProperties credentialTypeDisplay = openIDProviderMetadataService.getCredentialTypeDisplayPropertiesByLocale(openIDProviderMetadata, credentialType.getCredentialConfigurationId(), locale).orElse(null);
        final Map<String, DisplayProperties> credentialAttributes = openIDProviderMetadataService.getCredentialSubjectDisplayPropertiesByLocale(openIDProviderMetadata, credentialType.getCredentialConfigurationId(), locale);
        return CredentialTypeDto.from(credentialType, issuerDisplay, credentialTypeDisplay, credentialAttributes);
    }

}
