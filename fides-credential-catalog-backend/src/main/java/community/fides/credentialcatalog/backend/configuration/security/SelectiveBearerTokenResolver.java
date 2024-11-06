package community.fides.credentialcatalog.backend.configuration.security;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;


@Component
public class SelectiveBearerTokenResolver implements BearerTokenResolver {

    private final List<String> pathsToIgnore;
    private BearerTokenResolver defaultBearerTokenResolver = new DefaultBearerTokenResolver();

    public SelectiveBearerTokenResolver(@Value("${jwt.paths-to-ignore:}") String pathsToIgnore) {
        this.pathsToIgnore = List.of(pathsToIgnore.split(","));
    }

    public String resolve(final HttpServletRequest request) {
        return isPathToIgnore(request.getRequestURI()) ? null : defaultBearerTokenResolver.resolve(request);
    }

    private boolean isPathToIgnore(String path) {
        AntPathMatcher matcher = new AntPathMatcher();
        return pathsToIgnore.stream().anyMatch(pathToIgnore -> matcher.match(pathToIgnore, path));
    }
}
