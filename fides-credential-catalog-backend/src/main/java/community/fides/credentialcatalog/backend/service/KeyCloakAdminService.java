package community.fides.credentialcatalog.backend.service;

import community.fides.credentialcatalog.backend.configuration.error.ErrorCodeException;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.GroupRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class KeyCloakAdminService {

    private final Keycloak keycloak;

    Page<UserRepresentation> findAllUsers(Pageable pageable) {
        final RealmResource fides = getRealm();
        final GroupRepresentation credentialCatalogUserGroup = fides
                .groups()
                .groups()
                .stream()
                .filter(group -> group.getName().equals("CREDENTIAL_CATALOG_USER"))
                .findFirst().orElseThrow(() -> new IllegalArgumentException("Group CREDENTIAL_CATALOG_USER not found"));

        final int count = fides
                .groups()
                .group(credentialCatalogUserGroup.getId())
                .members().size();
        final List<UserRepresentation> members = fides
                .groups()
                .group(credentialCatalogUserGroup.getId())
                .members(pageable.getPageNumber() * pageable.getPageSize(), pageable.getPageSize());
        return new PageImpl<>(members, pageable, count);
    }

    public Optional<UserRepresentation> findById(final String id) {
        final UserResource userResource = getRealm().users().get(id);
        if (userResource == null) {
            return Optional.empty();
        }
        return Optional.of(userResource.toRepresentation());
    }

    public Optional<UserRepresentation> findByUserName(final String userName) {
        return getRealm().users().searchByUsername(userName, true).stream().findFirst();
    }

    private RealmResource getRealm() {
        return keycloak.realm("fides");
    }

    public UserRepresentation addUser(final String userName, final String firstName, final String lastName, final @NotNull String organizationExternalKey, final String newPassword) {

        findByUserName(userName).ifPresent(user -> {
            throw new ErrorCodeException("1", "Username already exists");
        });
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(newPassword);
        credential.setTemporary(true);

        final UserRepresentation userRepresentation = new UserRepresentation();
        userRepresentation.setUsername(userName);
        userRepresentation.setFirstName(firstName);
        userRepresentation.setLastName(lastName);
        userRepresentation.setAttributes(Map.of("organization_external_key", List.of(organizationExternalKey)));
        userRepresentation.setEnabled(true);
        userRepresentation.setGroups(List.of("CREDENTIAL_CATALOG_USER"));
        userRepresentation.setCredentials(List.of(credential));
        final Response response = getRealm().users().create(userRepresentation);
        if (response.getStatus() != 201) {
            throw new IllegalArgumentException("User not created");
        }
        var location = response.getHeaderString("Location");
//        https://iam.acc.credenco.com/admin/realms/fides/users/97c591b3-b896-40ce-a6c0-ccce11abd762
        final String userId = location.substring(location.lastIndexOf("/") + 1);

        return findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public UserRepresentation updateUser(final String userId, final String userName, final String firstName, final String lastName, final @NotNull String organizationExternalKey) {

        final UserRepresentation userRepresentation = findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        userRepresentation.setUsername(userName);
        userRepresentation.setFirstName(firstName);
        userRepresentation.setLastName(lastName);
        userRepresentation.setAttributes(Map.of("organization_external_key", List.of(organizationExternalKey)));
        userRepresentation.setEnabled(true);

        try {
            getRealm().users().get(userId).update(userRepresentation);
        } catch (jakarta.ws.rs.BadRequestException e) {
            throw new ErrorCodeException("0", "Error updating user.");
        }
        return findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public UserRepresentation resetPassword(final String userId, final String newPassword) {
        final UserRepresentation userRepresentation = findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(newPassword);
        credential.setTemporary(true);

        userRepresentation.setCredentials(List.of(credential));
        try {
            getRealm().users().get(userId).update(userRepresentation);
        } catch (jakarta.ws.rs.BadRequestException e) {
            throw new ErrorCodeException("0", "Error updating user.");
        }
        return userRepresentation;
    }

    public void deleteUser(final String userId) {
        getRealm().users().delete(userId);
    }

    public Long countUsersByOrganizationExternalKey(final String organizationExternalKey) {
        return getRealm().users().searchByAttributes("organization_external_key:" + organizationExternalKey).stream().count();
    }
}
