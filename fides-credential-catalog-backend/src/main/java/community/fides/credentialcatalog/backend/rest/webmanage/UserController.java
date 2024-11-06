package community.fides.credentialcatalog.backend.rest.webmanage;

import community.fides.credentialcatalog.backend.configuration.security.LocalPrincipal;
import community.fides.credentialcatalog.backend.rest.webmanage.dto.UserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController()
@RequestMapping("/api/user")
@Slf4j
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class UserController {

    @GetMapping
    public UserDto getUser(LocalPrincipal principal) {
        return UserDto.from(principal);
    }

}
