package community.fides.credentialcatalog.backend.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.ArrayList;
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
public class IssuanceConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "organization_id")
    @ToString.Exclude
    private Organization organization;

    private String name;

    @NotNull
    private String issuanceUrl;

    private String issuanceContent;

    // Retrieved from issuer-meta-data
    @ElementCollection(targetClass = String.class)
    @CollectionTable(name = "ic_grant_types_supported", joinColumns = @JoinColumn(name = "issuance_config_id"))
    private List<String> grantTypesSupported;

    @Builder.Default
    @NotNull
    @Enumerated(EnumType.STRING)
    private DeploymentEnvironment deploymentEnvironment = DeploymentEnvironment.SANDBOX;

    @Builder.Default
    @NotNull
    @Enumerated(EnumType.STRING)
    private VisibilityStatus visibilityStatus = VisibilityStatus.PRIVATE;

    @Builder.Default
    @NotNull
    @Enumerated(EnumType.STRING)
    private OpenId4VcSpecVersion supportedOpenId4VcSpecVersion = OpenId4VcSpecVersion.DRAFT13;

    @OneToMany(mappedBy = "issuanceConfig", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<IssuanceConfigCredentialType> credentialTypes = new ArrayList<>();

    @ElementCollection(targetClass = String.class)
    @CollectionTable(name = "ic_issuer_display_locale", joinColumns = @JoinColumn(name = "issuance_config_id"))
    private List<String> issuerDisplayLocale;

    private String description;

    @NotNull
    private LocalDateTime createdAt;
    @NotNull
    private String createdBy;

    private LocalDateTime updatedAt;
    private String updatedBy;

}
