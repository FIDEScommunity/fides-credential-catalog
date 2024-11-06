package community.fides.credentialcatalog.backend.repository;

import community.fides.credentialcatalog.backend.domain.IssuanceConfig;
import community.fides.credentialcatalog.backend.domain.Organization;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface IssuanceConfigRepository extends JpaRepository<IssuanceConfig, Long> {

    Page<IssuanceConfig> findByOrganization(Organization organization, Pageable pageable);

    Optional<IssuanceConfig> findByOrganizationAndId(Organization organization, Long id);
    Optional<IssuanceConfig> findByOrganizationAndIssuanceUrl(Organization organization, String issuanceUrl);

    Long countByOrganization_id(Long organizationId);

    @Query(value = """
            SELECT DISTINCT grant_types_supported 
            FROM ic_grant_types_supported
            """, nativeQuery = true)
    List<String> getUniqueGrantTypesSupported();

    boolean existsByIssuanceUrlAndIdNot(@NotNull String issuanceUrl, Long id);

    boolean existsByIssuanceUrl(@NotNull String issuanceUrl);
}


