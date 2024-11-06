package community.fides.credentialcatalog.backend.rest.webmanage;

import community.fides.credentialcatalog.backend.configuration.security.LocalPrincipal;
import community.fides.credentialcatalog.backend.rest.webmanage.form.KeyCloakUserForm;
import community.fides.credentialcatalog.backend.service.UserMaintenanceService;
import community.fides.credentialcatalog.backend.service.dto.KeyCloakUserDto;
import jakarta.annotation.security.RolesAllowed;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedModel;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController()
@RequestMapping("/api/usermaintenance/user")
@Slf4j
@RequiredArgsConstructor
@RolesAllowed(LocalPrincipal.ROLE_FIDES_ADMIN)
public class UserMaintenanceController {

    private final UserMaintenanceService userMaintenanceService;

    @GetMapping()
    public PagedModel<KeyCloakUserDto> findAll(Pageable pageable) {
        return userMaintenanceService.findAllUsers(pageable);
    }

    @GetMapping("/{userId}")
    public KeyCloakUserDto findByUserName(@PathVariable String userId) {
        return userMaintenanceService.findById(userId);
    }

    @PostMapping
    public KeyCloakUserDto addOrUpdate(@Valid @RequestBody KeyCloakUserForm keyCloakUserForm) {
        if (keyCloakUserForm.getId() == null) {
            return userMaintenanceService.add(keyCloakUserForm.getUserName(), keyCloakUserForm.getFirstName(), keyCloakUserForm.getLastName(), keyCloakUserForm.getOrganization().getId());
        } else {
            return userMaintenanceService.update(keyCloakUserForm.getId(), keyCloakUserForm.getUserName(), keyCloakUserForm.getFirstName(), keyCloakUserForm.getLastName(), keyCloakUserForm.getOrganization().getId());
        }
    }

    @PostMapping("/{userId}/passwordreset")
    public KeyCloakUserDto passwordReset(@PathVariable String userId) {
        return userMaintenanceService.resetPassword(userId);
    }

    @DeleteMapping("/{userId}")
    public void deleteUser(@PathVariable String userId) {
        userMaintenanceService.deleteUser(userId);
    }


}
