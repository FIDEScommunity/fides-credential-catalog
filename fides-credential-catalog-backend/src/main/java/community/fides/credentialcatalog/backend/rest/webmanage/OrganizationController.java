package community.fides.credentialcatalog.backend.rest.webmanage;

import community.fides.credentialcatalog.backend.configuration.error.ErrorCodeException;
import community.fides.credentialcatalog.backend.configuration.security.LocalPrincipal;
import community.fides.credentialcatalog.backend.domain.Organization;
import community.fides.credentialcatalog.backend.repository.IssuanceConfigRepository;
import community.fides.credentialcatalog.backend.repository.OrganizationRepository;
import community.fides.credentialcatalog.backend.rest.webmanage.dto.OrganizationDto;
import community.fides.credentialcatalog.backend.rest.webmanage.form.OrganizationForm;
import community.fides.credentialcatalog.backend.service.KeyCloakAdminService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedModel;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController()
@RequestMapping("/api/organization")
@Slf4j
@RequiredArgsConstructor
@RolesAllowed(LocalPrincipal.ROLE_FIDES_ADMIN)
public class OrganizationController {

    private final OrganizationRepository organizationRepository;
    private final IssuanceConfigRepository issuanceConfigRepository;
    private final KeyCloakAdminService keyCloakAdminService;

    @GetMapping
    public PagedModel<OrganizationDto> findAll(@PageableDefault(sort = "name") Pageable pageable) {
        final Page<Organization> items = organizationRepository.findAll(pageable);
        return new PagedModel<>(items.map(OrganizationDto::from));
    }

    @GetMapping("/{id}")
    public OrganizationDto findById(@PathVariable Long id) {
        return OrganizationDto.from(organizationRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Organization not found")));
    }

    @PostMapping
    public OrganizationDto addOrUpdate(@Valid @RequestBody OrganizationForm organizationForm) {
        final Organization organization = (organizationForm.getId() == null) ? addOrganization(organizationForm) : updateOrganization(organizationForm);
        return OrganizationDto.from(organization);
    }

    @DeleteMapping("/{id}")
    public void deleteOrganization(@PathVariable Long id) {
        if (issuanceConfigRepository.countByOrganization_id(id) > 0) {
            throw new ErrorCodeException("", "Organization is still in use by issuer confirugations");
        }
        final Organization organization = organizationRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Organization not found"));
        if (keyCloakAdminService.countUsersByOrganizationExternalKey(organization.getExternalKey()) > 0) {
            throw new ErrorCodeException("", "Organization is still in use by user logins");
        }
        organizationRepository.deleteById(id);
    }

    private Organization updateOrganization(final OrganizationForm organizationForm) {
        final Organization organization = organizationRepository.findById(organizationForm.getId()).orElseThrow(() -> new IllegalArgumentException("Organization not found"));
        organization.setName(organizationForm.getName());
        return organizationRepository.save(organization);
    }

    private Organization addOrganization(final OrganizationForm organizationForm) {
        return organizationRepository.save(
                Organization.builder()
                        .name(organizationForm.getName())
                        .externalKey(UUID.randomUUID().toString())
                        .apiKey(UUID.randomUUID().toString().replace("-", ""))
                        .build()
        );
    }

}
