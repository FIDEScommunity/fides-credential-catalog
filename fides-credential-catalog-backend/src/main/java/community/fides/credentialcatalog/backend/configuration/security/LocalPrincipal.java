package community.fides.credentialcatalog.backend.configuration.security;

import community.fides.credentialcatalog.backend.domain.Organization;
import java.util.Collection;
import lombok.Getter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;

@Getter
public class LocalPrincipal extends AbstractAuthenticationToken {

    public static final String ROLE_API_KEY = "ROLE_API_KEY";
    public static final String ROLE_END_USER = "ROLE_END_USER";
    public static final String ROLE_FIDES_ADMIN = "ROLE_FIDES_ADMIN";

    private final Organization organization;
    private final String userName;
    private final String fullName;
    private final String firstName;
    private final String lastName;

    public LocalPrincipal(Organization organization, String userName, String fullName, final String firstName, final String lastName, Collection<? extends GrantedAuthority> authorities) {
        super(authorities);
        this.organization = organization;
        this.userName = userName;
        this.fullName = fullName;
        this.firstName = firstName;
        this.lastName = lastName;
        setAuthenticated(true);
    }

    @Override
    public Object getCredentials() {
        return null;
    }

    @Override
    public Object getPrincipal() {
        return organization;
    }

    @Override
    public String getName() {
        return userName;
    }

    public boolean isAdmin() {
        return getAuthorities().stream().anyMatch(a -> a.getAuthority().equals(ROLE_FIDES_ADMIN));
    }
}
