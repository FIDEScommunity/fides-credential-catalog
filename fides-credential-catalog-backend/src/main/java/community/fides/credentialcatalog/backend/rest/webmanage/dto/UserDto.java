package community.fides.credentialcatalog.backend.rest.webmanage.dto;

import community.fides.credentialcatalog.backend.configuration.security.LocalPrincipal;
import java.util.List;
import lombok.Builder;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;

@Builder
@Getter
public class UserDto {

    private String name;
    private String fullName;
    private String firstName;
    private String lastName;
    private OrganizationDto organization;
    private List<String> roles;

    public static UserDto from(LocalPrincipal principal) {
        return UserDto.builder()
                .name(principal.getName())
                .fullName(principal.getFullName())
                .firstName(principal.getFirstName())
                .lastName(principal.getLastName())
                .organization(OrganizationDto.from(principal.getOrganization()))
                .roles(principal.getAuthorities().stream().map(GrantedAuthority::getAuthority).map(role -> role.replace("ROLE_", "")).toList())
                .build();

    }
}
