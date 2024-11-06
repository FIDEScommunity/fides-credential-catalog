package community.fides.credentialcatalog.backend.service;

import community.fides.credentialcatalog.backend.configuration.error.ErrorCodeException;
import community.fides.credentialcatalog.backend.configuration.security.LocalPrincipal;
import community.fides.credentialcatalog.backend.domain.FormToJpaCollectionMerger;
import community.fides.credentialcatalog.backend.domain.IssuanceConfig;
import community.fides.credentialcatalog.backend.domain.IssuanceConfigCredentialType;
import community.fides.credentialcatalog.backend.repository.IssuanceConfigRepository;
import community.fides.credentialcatalog.backend.repository.OrganizationRepository;
import community.fides.credentialcatalog.backend.rest.webmanage.form.IssuanceConfigCredentialTypeForm;
import community.fides.credentialcatalog.backend.rest.webmanage.form.IssuanceConfigForm;
import community.fides.credentialcatalog.backend.utils.EqualUtils;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class IssuanceConfigService {

    private final IssuanceConfigRepository issuanceConfigRepository;
    private final IssuanceConfigContentUpdater issuanceConfigContentUpdater;
    private final HtmlSanitizeService htmlSanitizeService;
    private final OrganizationRepository organizationRepository;

    final FormToJpaCollectionMerger<IssuanceConfigCredentialTypeForm, IssuanceConfigCredentialType> credentialTypeMerger = new FormToJpaCollectionMerger<>();

    public Page<IssuanceConfig> findAll(LocalPrincipal localPrincipal, Pageable pageable) {
        if (localPrincipal.isAdmin()) {
            return issuanceConfigRepository.findAll(pageable);
        } else {
            return issuanceConfigRepository.findByOrganization(localPrincipal.getOrganization(), pageable);
        }
    }

    public Optional<IssuanceConfig> findById(LocalPrincipal localPrincipal, Long id) {
        if (localPrincipal.isAdmin()) {
            return issuanceConfigRepository.findById(id);
        } else {
            return issuanceConfigRepository.findByOrganizationAndId(localPrincipal.getOrganization(), id);
        }
    }

    public void delete(LocalPrincipal localPrincipal, Long id) {
        final IssuanceConfig issuanceConfig = findById(localPrincipal, id).orElseThrow(() -> new IllegalArgumentException("IssuanceConfig not found"));
        issuanceConfigRepository.delete(issuanceConfig);
    }

    @Transactional
    public IssuanceConfig saveOrUpdate(final LocalPrincipal principal, final IssuanceConfigForm issuanceConfigForm) {
        final IssuanceConfig issuanceConfig = (issuanceConfigForm.getId() == null)
                ? createNewIssuanceConfig(principal)
                : findById(principal, issuanceConfigForm.getId()).orElseThrow(() -> new IllegalArgumentException("IssuanceConfig not found"));


        checkForDuplicateIssuanceUrl(issuanceConfigForm.getId(), issuanceConfigForm.getIssuanceUrl());

        setOrganization(issuanceConfig, principal, issuanceConfigForm);
        issuanceConfig.setName(issuanceConfigForm.getName());
        issuanceConfig.setIssuanceUrl(issuanceConfigForm.getIssuanceUrl());

        issuanceConfig.setDeploymentEnvironment(issuanceConfigForm.getDeploymentEnvironment());
        issuanceConfig.setVisibilityStatus(issuanceConfigForm.getVisibilityStatus());
        issuanceConfig.setSupportedOpenId4VcSpecVersion(issuanceConfigForm.getSupportedOpenId4VcSpecVersion());
        issuanceConfig.setUpdatedAt(LocalDateTime.now());
        issuanceConfig.setUpdatedBy(principal.getName());
        issuanceConfig.setDescription(htmlSanitizeService.sanitize(issuanceConfigForm.getDescription()));

        credentialTypeMerger.buildJpaCollection(
                issuanceConfigForm.getCredentialTypes(),
                issuanceConfig.getCredentialTypes(),
                (credentialTypeUpdate, credentialTypeCurrent) -> EqualUtils.equals(credentialTypeUpdate.getCredentialConfigurationId(), credentialTypeCurrent.getCredentialConfigurationId()),
                (form, entity) -> {
                    entity.setIssuanceConfig(issuanceConfig);
                    entity.setCredentialConfigurationId(form.getCredentialConfigurationId());
                    entity.setCredentialKind(form.getCredentialKind());
                    entity.setDefaultDisplayLocale(form.getDefaultDisplayLocale());
                    entity.setSchemaUrl(form.getSchemaUrl());
                    entity.setSchemaInfo(form.getSchemaInfo());
                    entity.setTrustFrameworkUrl(form.getTrustFrameworkUrl());
                    entity.setTrustFrameworkInfo(form.getTrustFrameworkInfo());
                    entity.setDocumentationUrl(form.getDocumentationUrl());
                    entity.setDocumentationInfo(form.getDocumentationInfo());
                    entity.setIssuePortalUrl(form.getIssuePortalUrl());
                    return entity;
                },
                (form) -> {
                    var configCredentialType = new IssuanceConfigCredentialType();
                    configCredentialType.setIssuanceConfig(issuanceConfig);
                    configCredentialType.setCredentialConfigurationId(form.getCredentialConfigurationId());
                    configCredentialType.setCredentialKind(form.getCredentialKind());
                    configCredentialType.setDefaultDisplayLocale(form.getDefaultDisplayLocale());
                    configCredentialType.setSchemaUrl(form.getSchemaUrl());
                    configCredentialType.setSchemaInfo(form.getSchemaInfo());
                    configCredentialType.setTrustFrameworkUrl(form.getTrustFrameworkUrl());
                    configCredentialType.setTrustFrameworkInfo(form.getTrustFrameworkInfo());
                    configCredentialType.setDocumentationUrl(form.getDocumentationUrl());
                    configCredentialType.setDocumentationInfo(form.getDocumentationInfo());
                    configCredentialType.setIssuePortalUrl(form.getIssuePortalUrl());
                    return configCredentialType;
                });

        final IssuanceConfig saved = issuanceConfigRepository.save(issuanceConfig);
        issuanceConfigContentUpdater.retrieveAndStoreIssuanceContentAndUpdateCredentialTypes(saved.getId());
        return saved;
    }

    private void setOrganization(final IssuanceConfig issuanceConfig, final LocalPrincipal principal, final IssuanceConfigForm issuanceConfigForm) {
        if (principal.isAdmin()) {
            if (issuanceConfigForm.getOrganization() != null) {
                issuanceConfig.setOrganization(organizationRepository.findById(issuanceConfigForm.getOrganization().getId()).orElseThrow(() -> new IllegalArgumentException("Organization not found")));
            } else {
                issuanceConfig.setOrganization(principal.getOrganization());
            }
        } else {
            issuanceConfig.setOrganization(principal.getOrganization());
        }
    }

    private void checkForDuplicateIssuanceUrl(final Long id, final @NotNull String issuanceUrl) {
        if (id == null) {
            if (issuanceConfigRepository.existsByIssuanceUrl(issuanceUrl)) {
                throw new ErrorCodeException("3", "Issuance URL already exists. Cannot be added twice.");
            }
        } else if (issuanceConfigRepository.existsByIssuanceUrlAndIdNot(issuanceUrl, id)) {
            throw new ErrorCodeException("3", "Issuance URL already exists. Cannot be added twice.");
        }
    }


    private IssuanceConfig createNewIssuanceConfig(final LocalPrincipal localPrincipal) {
        IssuanceConfig newIssuanceConfig = new IssuanceConfig();
        newIssuanceConfig.setOrganization(localPrincipal.getOrganization());
        newIssuanceConfig.setCreatedAt(LocalDateTime.now());
        newIssuanceConfig.setCreatedBy(localPrincipal.getName());
        return newIssuanceConfig;
    }


}
