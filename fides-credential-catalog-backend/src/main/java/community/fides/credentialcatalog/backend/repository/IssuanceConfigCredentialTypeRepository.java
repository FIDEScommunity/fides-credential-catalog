package community.fides.credentialcatalog.backend.repository;

import community.fides.credentialcatalog.backend.domain.CredentialKind;
import community.fides.credentialcatalog.backend.domain.DeploymentEnvironment;
import community.fides.credentialcatalog.backend.domain.IssuanceConfigCredentialType;
import community.fides.credentialcatalog.backend.domain.IssuanceConfigCredentialType_;
import community.fides.credentialcatalog.backend.domain.IssuanceConfig_;
import community.fides.credentialcatalog.backend.domain.VisibilityStatus;
import jakarta.persistence.criteria.Predicate;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Stream;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface IssuanceConfigCredentialTypeRepository extends JpaRepository<IssuanceConfigCredentialType, Long>, JpaSpecificationExecutor<IssuanceConfigCredentialType> {

    Optional<IssuanceConfigCredentialType> findByIdAndIssuanceConfig_visibilityStatus(Long id, VisibilityStatus visibilityStatus);

    default Specification<IssuanceConfigCredentialType> hasVisibilityStatus(List<VisibilityStatus> visibilityStatus) {
        return (credentialType, cq, cb) -> credentialType.get("issuanceConfig").get("visibilityStatus").in(visibilityStatus);
    }

    default Specification<IssuanceConfigCredentialType> hasDeploymentEnvironment(List<DeploymentEnvironment> deploymentEnvironment) {
        return (credentialType, cq, cb) -> credentialType.get("issuanceConfig").get("deploymentEnvironment").in(deploymentEnvironment);
    }


    default Specification<IssuanceConfigCredentialType> hasGrantTypesSupported(List<String> grantTypesSupported) {
        return grantTypesSupported.stream()
                .map(this::_hasGrantTypesSupported)
                .reduce(Specification::or).get();
    }

    default Specification<IssuanceConfigCredentialType> _hasGrantTypesSupported(String grantTypesSupported) {
        return (credentialType, cq, cb) -> (cb.isMember(grantTypesSupported, credentialType.get(IssuanceConfigCredentialType_.ISSUANCE_CONFIG).get(IssuanceConfig_.GRANT_TYPES_SUPPORTED)));
    }


    default Specification<IssuanceConfigCredentialType> hasCryptographicBindingMethodsSupported(List<String> cryptographicBindingMethodsSupported) {
        return cryptographicBindingMethodsSupported.stream()
                .map(this::_hasCryptographicBindingMethodsSupported)
                .reduce(Specification::or).get();
    }

    default Specification<IssuanceConfigCredentialType> _hasCryptographicBindingMethodsSupported(String cryptographicBindingMethodsSupported) {
        return (credentialType, cq, cb) -> (cb.isMember(cryptographicBindingMethodsSupported, credentialType.get(IssuanceConfigCredentialType_.CRYPTOGRAPHIC_BINDING_METHODS_SUPPORTED)));
    }

    default Specification<IssuanceConfigCredentialType> hasCredentialFormat(List<String> credentialFormat) {
        return credentialFormat.stream()
                .map(this::_hasCredentialFormat)
                .reduce(Specification::or).get();
    }

    default Specification<IssuanceConfigCredentialType> _hasCredentialFormat(String credentialFormat) {
        return (credentialType, cq, cb) -> cb.equal(credentialType.get(IssuanceConfigCredentialType_.CREDENTIAL_FORMAT), credentialFormat);
    }

    default Specification<IssuanceConfigCredentialType> hasCredentialSigningAlgValuesSupported(List<String> credentialSigningAlgValuesSupported) {
        return credentialSigningAlgValuesSupported.stream()
                .map(this::_hasCredentialSigningAlgValuesSupported)
                .reduce(Specification::or).get();
    }

    default Specification<IssuanceConfigCredentialType> _hasCredentialSigningAlgValuesSupported(String credentialSigningAlgValuesSupported) {
        return (credentialType, cq, cb) -> (cb.isMember(credentialSigningAlgValuesSupported, credentialType.get(IssuanceConfigCredentialType_.CREDENTIAL_SIGNING_ALG_VALUES_SUPPORTED)));
    }

    default Specification<IssuanceConfigCredentialType> hasLocale(List<String> locale) {
        final List<Specification<IssuanceConfigCredentialType>> list1 = locale.stream()
                .map(this::_hasLocale)
                .toList();
        final List<Specification<IssuanceConfigCredentialType>> list2 = locale.stream()
                .map(this::_hasDefaultLocale)
                .toList();
        return Stream.concat(list1.stream(), list2.stream())
                .reduce(Specification::or).get();
    }

    default Specification<IssuanceConfigCredentialType> _hasLocale(String locale) {
        return (credentialType, cq, cb) -> (cb.isMember(locale, credentialType.get(IssuanceConfigCredentialType_.LOCALE)));
    }

    default Specification<IssuanceConfigCredentialType> _hasDefaultLocale(String locale) {
        return (credentialType, cq, cb) -> cb.equal(credentialType.get(IssuanceConfigCredentialType_.DEFAULT_DISPLAY_LOCALE), locale);
    }

    default Specification<IssuanceConfigCredentialType> hasCredentialKind(List<CredentialKind> credentialKind) {
        return (credentialType, cq, cb) -> credentialType.get("credentialKind").in(credentialKind);
    }

    default Specification<IssuanceConfigCredentialType> containsSearchText(String searchText) {
        return (IssuanceConfigCredentialType, cq, cb) -> cb.like(cb.upper(IssuanceConfigCredentialType.get("searchData")), "%" + upper(searchText) + "%");
    }

    default Specification<IssuanceConfigCredentialType> containsDescription(String description) {
        return (IssuanceConfigCredentialType, cq, cb) -> cb.like(cb.upper(IssuanceConfigCredentialType.get("issuanceConfig").get("description")), "%" + upper(description) + "%");
    }

    private String upper(String text) {
        return text != null ? text.toUpperCase(Locale.ROOT) : null;
    }

    default Specification<IssuanceConfigCredentialType> allOf(List<Specification<IssuanceConfigCredentialType>> specifications) {
        return (IssuanceConfigCredentialType, cq, cb) -> {
            Predicate[] predicates = specifications.stream().map(specification -> specification.toPredicate(IssuanceConfigCredentialType, cq, cb))
                    .toArray(Predicate[]::new);
            return cb.and(predicates);
        };
    }

    default Specification<IssuanceConfigCredentialType> anyOf(List<Specification<IssuanceConfigCredentialType>> specifications) {
        return (IssuanceConfigCredentialType, cq, cb) -> {
            Predicate[] predicates = specifications.stream().map(specification -> specification.toPredicate(IssuanceConfigCredentialType, cq, cb))
                    .toArray(Predicate[]::new);
            return cb.or(predicates);
        };
    }

    @Query(value = """
            SELECT DISTINCT credential_format 
            FROM issuance_config_credential_type
            """, nativeQuery = true)
    List<String> getUniqueCredentialFormats();

    @Query(value = """
            SELECT DISTINCT cryptographic_binding_methods_supported
            FROM ct_cryptographic_binding_methods_supported
            """, nativeQuery = true)
    List<String> getUniqueCryptographicBindingMethodsSupported();

    @Query(value = """
            SELECT DISTINCT credential_signing_alg_values_supported
            FROM ct_credential_signing_alg_values_supported
            """, nativeQuery = true)
    List<String> getUniqueCredentialSigningAlgValuesSupported();

    @Query(value = """
            SELECT DISTINCT locale from (
                SELECT DISTINCT locale
                FROM ct_locale
                union
                SELECT DISTINCT default_display_locale
                FROM issuance_config_credential_type
                where default_display_locale is not null
                union
                SELECT DISTINCT issuer_display_locale
                FROM ic_issuer_display_locale
            ) as locales
            """, nativeQuery = true)
    List<String> getUniqueLocales();
}


