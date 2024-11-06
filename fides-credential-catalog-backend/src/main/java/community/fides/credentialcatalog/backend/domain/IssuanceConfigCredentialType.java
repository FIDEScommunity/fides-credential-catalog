package community.fides.credentialcatalog.backend.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class IssuanceConfigCredentialType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "issuance_config_id")
    @ToString.Exclude
    private IssuanceConfig issuanceConfig;

    @NotNull
    private String credentialConfigurationId;
    // Retrieved from issuer-meta-data
    private String credentialFormat;

    // Retrieved from issuer-meta-data
    @ElementCollection(targetClass = String.class)
    @CollectionTable(name = "ct_cryptographic_binding_methods_supported", joinColumns = @JoinColumn(name = "issuance_config_credential_type_id"))
    private List<String> cryptographicBindingMethodsSupported;

    // Retrieved from issuer-meta-data
    @ElementCollection(targetClass = String.class)
    @CollectionTable(name = "ct_credential_signing_alg_values_supported", joinColumns = @JoinColumn(name = "issuance_config_credential_type_id"))
    private List<String> credentialSigningAlgValuesSupported;

    // Retrieved from issuer-meta-data
    @ElementCollection(targetClass = String.class)
    @CollectionTable(name = "ct_locale", joinColumns = @JoinColumn(name = "issuance_config_credential_type_id"))
    private List<String> locale;

    @Enumerated(EnumType.STRING)
    private CredentialKind credentialKind;

    private String defaultDisplayLocale;

    private String schemaUrl;
    private String schemaInfo;
    private String trustFrameworkUrl;
    private String trustFrameworkInfo;
    private String documentationUrl;
    private String documentationInfo;
    private String searchData;
    private String issuePortalUrl;

}
