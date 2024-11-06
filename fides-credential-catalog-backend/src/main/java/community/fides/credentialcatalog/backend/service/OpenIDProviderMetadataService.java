package community.fides.credentialcatalog.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import community.fides.credentialcatalog.backend.domain.IssuanceConfig;
import community.fides.credentialcatalog.backend.service.openidissuance.dto.AttributeDefinition;
import community.fides.credentialcatalog.backend.service.openidissuance.dto.CredentialConfigurationSupported;
import community.fides.credentialcatalog.backend.service.openidissuance.dto.CredentialDefinition;
import community.fides.credentialcatalog.backend.service.openidissuance.dto.DisplayProperties;
import community.fides.credentialcatalog.backend.service.openidissuance.dto.OpenIDProviderMetadata;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import org.springframework.stereotype.Service;
import static community.fides.credentialcatalog.backend.rest.webmanage.dto.LocaleDisplayFilter.getByLocale;

@Service
@RequiredArgsConstructor
public class OpenIDProviderMetadataService {

    private final ObjectMapper objectMapper;

    @SneakyThrows
    public OpenIDProviderMetadata getOpenIDProviderMetadata(final String issuanceContent) {
        if (issuanceContent == null) {
            return null;
        }
        return objectMapper.readValue(issuanceContent, OpenIDProviderMetadata.class);
    }

    public Optional<DisplayProperties> getIssuerDisplayPropertiesByLocale(OpenIDProviderMetadata openIDProviderMetadata, String locale) {
        if (openIDProviderMetadata.getDisplay() == null) {
            final DisplayProperties displayProperties = new DisplayProperties();
            displayProperties.setName(getHostname(openIDProviderMetadata.getCredentialIssuer()));
            return Optional.of(displayProperties);
        }
        return Optional.ofNullable(getByLocale(openIDProviderMetadata.getDisplay(), locale));
    }

    public Optional<DisplayProperties> getCredentialTypeDisplayPropertiesByLocale(OpenIDProviderMetadata openIDProviderMetadata, String credentialConfigurationId, String locale) {
        if (!openIDProviderMetadata.getCredentialConfigurationsSupported().containsKey(credentialConfigurationId)) {
            return Optional.empty();
        }
        return Optional.of(getByLocale(openIDProviderMetadata.getCredentialConfigurationsSupported().get(credentialConfigurationId).getDisplay(), locale));
    }

    public Map<String, DisplayProperties> getCredentialSubjectDisplayPropertiesByLocale(OpenIDProviderMetadata openIDProviderMetadata, String credentialConfigurationId, String locale) {
        if (!openIDProviderMetadata.getCredentialConfigurationsSupported().containsKey(credentialConfigurationId)) {
            return Map.of();
        }

        var attributeDefinitions = getAttributeDefinitions(openIDProviderMetadata.getCredentialConfigurationsSupported().get(credentialConfigurationId));
        if (attributeDefinitions == null) {
            return Map.of();
        }
        return attributeDefinitions.entrySet().stream()
                .map(entry -> Map.entry(entry.getKey(), getByLocale(entry.getValue().getDisplay(), locale)))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    private Map<String, AttributeDefinition> getAttributeDefinitions(CredentialConfigurationSupported credentialConfiguration) {
        if (credentialConfiguration.getFormat().equalsIgnoreCase("vc+sd-jwt")) {
            return getSdJwtAttributes(credentialConfiguration);
        } else if (credentialConfiguration.getFormat().equalsIgnoreCase("mso_mdoc")) {
            return getMDocAttributes(credentialConfiguration);
        } else {
            return getVcJwtAttributes(credentialConfiguration);
        }
    }

    private static Map<String, AttributeDefinition> getVcJwtAttributes(CredentialConfigurationSupported credentialConfiguration) {
        final CredentialDefinition credentialDefinition = credentialConfiguration.getCredentialDefinition();
        if (credentialDefinition == null) {
            return Map.of();
        }
        return credentialDefinition.getCredentialSubject();
    }

    private Map<String, AttributeDefinition> getSdJwtAttributes(CredentialConfigurationSupported credentialConfiguration) {
        if (credentialConfiguration.getClaims() == null) {
            return Map.of();
        }
        return objectMapper.convertValue(credentialConfiguration.getClaims(), new TypeReference<>() {});
    }

    private Map<String, AttributeDefinition> getMDocAttributes(CredentialConfigurationSupported credentialConfiguration) {
        if (credentialConfiguration.getClaims() == null || !credentialConfiguration.getClaims().fieldNames().hasNext()) {
            return Map.of();
        }
        return objectMapper.convertValue(credentialConfiguration.getClaims().get(credentialConfiguration.getClaims().fieldNames().next()), new TypeReference<>() {});
    }

    private static String getHostname(final String issuerUrl) {
        final int startIndex = issuerUrl.indexOf("://") + 3;
        final int endIndex = issuerUrl.indexOf("/", startIndex);
        if (endIndex < 0) {
            return issuerUrl.substring(startIndex);
        }
        return issuerUrl.substring(startIndex, endIndex);
    }
}
