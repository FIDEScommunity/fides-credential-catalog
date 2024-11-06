package community.fides.credentialcatalog.backend.configuration.security;

import community.fides.credentialcatalog.backend.domain.Organization;
import community.fides.credentialcatalog.backend.repository.OrganizationRepository;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CustomJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final OrganizationRepository organizationRepository;


    @Override
    public AbstractAuthenticationToken convert(Jwt source) {
        var organizationExternalKey = source.getClaimAsString("organization_external_key");
        var name = source.getClaimAsString("preferred_username");
        var firstName = source.getClaimAsString("given_name");
        var lastName = source.getClaimAsString("family_name");
        var fullName = firstName + " " + lastName;
        final Organization organization = organizationRepository.findByExternalKey(organizationExternalKey)
                .orElseThrow(() -> new IllegalArgumentException("Invalid organization external key"));
        return new LocalPrincipal(organization, name, fullName.trim(), firstName, lastName, AuthorityUtils.createAuthorityList(getRoles(source)));
    }

    private List<String> getRoles(final Jwt source) {
        var roles = new ArrayList<String>();
        roles.add(LocalPrincipal.ROLE_END_USER);
        if ((source.getClaimAsMap("realm_access") != null) && (source.getClaimAsMap("realm_access").get("roles") != null) && source.getClaimAsMap("realm_access").get("roles") instanceof List roleList) {
            if (roleList.contains("fides_admin")) {
                roles.add(LocalPrincipal.ROLE_FIDES_ADMIN);
            }
        }
        return roles;
    }
}
