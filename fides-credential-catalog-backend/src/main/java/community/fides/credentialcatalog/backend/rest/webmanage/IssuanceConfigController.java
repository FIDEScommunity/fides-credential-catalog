package community.fides.credentialcatalog.backend.rest.webmanage;

import community.fides.credentialcatalog.backend.configuration.error.ErrorCodeException;
import community.fides.credentialcatalog.backend.configuration.security.LocalPrincipal;
import community.fides.credentialcatalog.backend.domain.IssuanceConfig;
import community.fides.credentialcatalog.backend.rest.webmanage.dto.IssuanceConfigDto;
import community.fides.credentialcatalog.backend.rest.webmanage.form.IssuanceConfigForm;
import community.fides.credentialcatalog.backend.service.IssuanceConfigContentUpdater;
import community.fides.credentialcatalog.backend.service.IssuanceConfigService;
import community.fides.credentialcatalog.backend.service.IssuanceUrlLogService;
import community.fides.credentialcatalog.backend.service.OpenIDProviderMetadataService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedModel;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.ObjectUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController()
@RequestMapping("/api/issuanceConfig")
@Slf4j
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class IssuanceConfigController {

    private final IssuanceConfigService issuanceConfigService;
    private final IssuanceConfigContentUpdater issuanceConfigContentUpdater;
    private final OpenIDProviderMetadataService openIDProviderMetadataService;
    private final IssuanceUrlLogService issuanceUrlLogService;

    @GetMapping()
    public PagedModel<IssuanceConfigDto> findAll(LocalPrincipal principal, @RequestParam(value = "locale", required = false, defaultValue = "nl-NL") String locale, Pageable pageable) {
        final Page<IssuanceConfig> items = issuanceConfigService.findAll(principal, pageable);
        return new PagedModel(items.map(issuanceConfig -> IssuanceConfigDto.from(principal, issuanceConfig, openIDProviderMetadataService.getOpenIDProviderMetadata(issuanceConfig.getIssuanceContent()), locale)));
    }


    @GetMapping("/{id}")
    public IssuanceConfigDto get(LocalPrincipal principal, @PathVariable Long id, @RequestParam(value = "locale", required = false, defaultValue = "nl-NL") String locale) {
        final IssuanceConfig issuanceConfig = issuanceConfigService.findById(principal, id)
                .orElseThrow(() -> new IllegalArgumentException("IssuanceConfig not found"));
        return IssuanceConfigDto.from(principal, issuanceConfig, openIDProviderMetadataService.getOpenIDProviderMetadata(issuanceConfig.getIssuanceContent()), locale);
    }

    @PostMapping
    public IssuanceConfigDto addOrUpdate(LocalPrincipal principal, @Valid @RequestBody IssuanceConfigForm issuanceConfigForm, @RequestParam(value = "locale", required = false, defaultValue = "nl-NL") String locale) {
        final IssuanceConfig issuanceConfig = issuanceConfigService.saveOrUpdate(principal, issuanceConfigForm);
        return IssuanceConfigDto.from(principal, issuanceConfig, openIDProviderMetadataService.getOpenIDProviderMetadata(issuanceConfig.getIssuanceContent()), locale);
    }

    @DeleteMapping("/{id}")
    public void delete(LocalPrincipal principal, @PathVariable Long id) {
        issuanceConfigService.delete(principal, id);
    }

    @SneakyThrows
    @PostMapping("/issuanceUrlData")
    @Transactional(readOnly = true)
    public IssuanceConfigDto getIssuanceUrlData(LocalPrincipal principal, @RequestBody IssuanceConfigForm issuanceConfigForm, @RequestParam(value = "locale", required = false, defaultValue = "nl-NL") String locale) {
        issuanceUrlLogService.logIssuanceUrl(principal, issuanceConfigForm.getIssuanceUrl());
        final IssuanceConfig issuanceConfig = issuanceConfigContentUpdater.retrieveIssuanceContentAndUpdateCredentialTypes(issuanceConfigForm.getIssuanceUrl());
        if (ObjectUtils.isEmpty(issuanceConfig.getCredentialTypes())) {
            throw new ErrorCodeException("2", "No credential types found in the issuance configuration");
        }
        return IssuanceConfigDto.from(principal, issuanceConfig, openIDProviderMetadataService.getOpenIDProviderMetadata(issuanceConfig.getIssuanceContent()), locale);
    }


}
