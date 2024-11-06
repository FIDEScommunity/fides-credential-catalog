package community.fides.credentialcatalog.backend.service;

import community.fides.credentialcatalog.backend.domain.Organization;
import community.fides.credentialcatalog.backend.repository.OrganizationRepository;
import community.fides.credentialcatalog.backend.service.dto.KeyCloakUserDto;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedModel;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserMaintenanceService {

    private final KeyCloakAdminService keyCloakAdminService;
    private final OrganizationRepository organizationRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public PagedModel<KeyCloakUserDto> findAllUsers(Pageable pageable) {
        final Page<UserRepresentation> allUsers = keyCloakAdminService.findAllUsers(pageable);
        return new PagedModel<>(allUsers.map(userRepresentation -> {
            final Optional<Organization> optionalOrganization = getOrganization(userRepresentation);
            return KeyCloakUserDto.from(userRepresentation, optionalOrganization.orElse(null));
        }));
    }

    public KeyCloakUserDto findById(final String id) {
        final Optional<UserRepresentation> user = keyCloakAdminService.findById(id);
        if (user.isEmpty()) {
            return null;
        }

        return KeyCloakUserDto.from(user.get(), getOrganization(user.get()).orElse(null));
    }

    public KeyCloakUserDto findByUserName(final String userName) {
        final Optional<UserRepresentation> byUserName = keyCloakAdminService.findByUserName(userName);
        if (byUserName.isEmpty()) {
            return null;
        }

        return KeyCloakUserDto.from(byUserName.get(), getOrganization(byUserName.get()).orElse(null));
    }

    private Optional<Organization> getOrganization(final UserRepresentation userRepresentation) {
        return organizationRepository.findByExternalKey(userRepresentation.firstAttribute("organization_external_key"));
    }

    public KeyCloakUserDto add(final String userName, final String firstName, final String lastName, final Long organizationId) {
        final Organization organization = organizationRepository.findById(organizationId).orElseThrow(() -> new IllegalArgumentException("Organization not found"));
        var newPassword = generatePassword();
        final UserRepresentation userRepresentation = keyCloakAdminService.addUser(userName, firstName, lastName, organization.getExternalKey(), newPassword);
        final KeyCloakUserDto keyCloakUserDto = KeyCloakUserDto.from(userRepresentation, organization);
        return keyCloakUserDto.toBuilder()
                .tempPassword(newPassword)
                .build();
    }

    public KeyCloakUserDto update(final String userId, final String userName, final String firstName, final String lastName, final Long organizationId) {
        final Organization organization = organizationRepository.findById(organizationId).orElseThrow(() -> new IllegalArgumentException("Organization not found"));
        final UserRepresentation userRepresentation = keyCloakAdminService.updateUser(userId, userName, firstName, lastName, organization.getExternalKey());
        return KeyCloakUserDto.from(userRepresentation, organization);
    }

    public KeyCloakUserDto resetPassword(final String userId) {
        var newPassword = generatePassword();
        final UserRepresentation userRepresentation = keyCloakAdminService.resetPassword(userId, newPassword);
        final Organization organization = getOrganization(userRepresentation).orElse(null);

        final KeyCloakUserDto keyCloakUserDto = KeyCloakUserDto.from(userRepresentation, organization);
        return keyCloakUserDto.toBuilder()
                .tempPassword(newPassword)
                .build();
    }

    private String generatePassword() {
        final ArrayList<Character> password = new ArrayList<>();
        password.addAll(secureRandom.ints(12, 65, 90).mapToObj(data -> (char) data).toList()); // Add uppercase letters
        password.addAll(secureRandom.ints(12, 97, 122).mapToObj(data -> (char) data).toList()); // Add lowercase letters
        password.addAll(secureRandom.ints(12, 48, 57).mapToObj(data -> (char) data).toList()); // Add numbers
        Collections.shuffle(password);
        return password.stream()
                .collect(StringBuilder::new, StringBuilder::append, StringBuilder::append)
                .toString();
    }

    public void deleteUser(final String userId) {
        keyCloakAdminService.deleteUser(userId);
    }
}
