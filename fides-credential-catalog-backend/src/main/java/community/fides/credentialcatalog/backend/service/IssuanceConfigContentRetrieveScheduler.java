package community.fides.credentialcatalog.backend.service;

import community.fides.credentialcatalog.backend.domain.IssuanceConfig;
import community.fides.credentialcatalog.backend.repository.IssuanceConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class IssuanceConfigContentRetrieveScheduler {

    private final IssuanceConfigRepository issuanceConfigRepository;
    private final IssuanceConfigContentUpdater issuanceConfigContentUpdater;

    @Scheduled(initialDelay = 1000, fixedDelayString = "PT1H")
    public void retrieveIssuerConfigurations() {
        issuanceConfigRepository.findAll().forEach(issuanceConfig -> retrieveAndStoreIssuanceConfigContent(issuanceConfig));
    }

    private void retrieveAndStoreIssuanceConfigContent(final IssuanceConfig issuanceConfig) {
        try {
            final IssuanceConfig issuanceConfigStored = issuanceConfigContentUpdater.retrieveAndStoreIssuanceContentAndUpdateCredentialTypes(issuanceConfig.getId());
            log.info("Updated issuer configuration. IssuanceConfig id {}, url: {}", issuanceConfigStored.getId(), issuanceConfigStored.getIssuanceUrl());
        } catch (Exception e) {
            log.error("Error retrieving issuanceConfigContent. IssuanceConfig.id {}, issuanceUrl: {}. Error: {}", issuanceConfig.getId(), issuanceConfig.getIssuanceUrl(), e.getMessage());
            e.printStackTrace();
        }
    }
}
