package community.fides.credentialcatalog.backend.repository;

import community.fides.credentialcatalog.backend.domain.IssuanceUrlLog;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IssuanceUrlLogRepository extends JpaRepository<IssuanceUrlLog, Long> {

    Optional<IssuanceUrlLog> findByIssuanceUrl(String issuanceUrl);
}


