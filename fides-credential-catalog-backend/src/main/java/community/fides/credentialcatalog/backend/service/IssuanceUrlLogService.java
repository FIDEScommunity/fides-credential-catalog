package community.fides.credentialcatalog.backend.service;

import community.fides.credentialcatalog.backend.configuration.security.LocalPrincipal;
import community.fides.credentialcatalog.backend.domain.IssuanceUrlLog;
import community.fides.credentialcatalog.backend.repository.IssuanceUrlLogRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import static org.springframework.transaction.annotation.Propagation.REQUIRES_NEW;

@Service
@RequiredArgsConstructor
public class IssuanceUrlLogService {

    private final IssuanceUrlLogRepository issuanceUrlLogRepository;

    @Transactional(propagation = REQUIRES_NEW)
    public void logIssuanceUrl(LocalPrincipal localPrincipal, String issuanceUrl) {
        final Optional<IssuanceUrlLog> existingUrl = issuanceUrlLogRepository.findByIssuanceUrl(issuanceUrl);
        if (existingUrl.isEmpty()) {
            issuanceUrlLogRepository.save(
                    IssuanceUrlLog.builder()
                            .issuanceUrl(issuanceUrl)
                            .organizationName(localPrincipal.getOrganization().getName())
                            .createdAt(LocalDateTime.now())
                            .createdBy(localPrincipal.getName())
                            .build()
            );
        }
    }
}
