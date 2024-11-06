package community.fides.credentialcatalog.backend.configuration.security;

import community.fides.credentialcatalog.backend.domain.Organization;
import community.fides.credentialcatalog.backend.repository.OrganizationRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.stereotype.Component;


@Component
@RequiredArgsConstructor
@Slf4j
public class ApiKeyAuthenticationService {

    private static final String AUTH_TOKEN_HEADER_NAME = "x-api-key";
    private final OrganizationRepository organizationRepository;


    public boolean hasApiKey(HttpServletRequest request) {
        return request.getHeader(AUTH_TOKEN_HEADER_NAME) != null;
    }

    public Authentication getAuthentication(HttpServletRequest request) {
        String apiKey = request.getHeader(AUTH_TOKEN_HEADER_NAME);
        if (apiKey == null) {
            throw new BadCredentialsException("Invalid API Key");
        }
        final Organization organization = organizationRepository.findByApiKey(apiKey).orElseThrow(() -> new BadCredentialsException("Invalid API Key"));
        log.info("API Key {} authentication successful for organization {}", apiKey, organization.getExternalKey());
        return new LocalPrincipal(organization, "apiKey", organization.getName(), "", organization.getName(), AuthorityUtils.createAuthorityList(LocalPrincipal.ROLE_API_KEY));
    }
}
