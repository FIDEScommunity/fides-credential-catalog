package community.fides.credentialcatalog.backend.configuration;

import lombok.extern.slf4j.Slf4j;
import org.keycloak.OAuth2Constants;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.KeycloakBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class KeyCloakConfig {


    @Bean
    public Keycloak keycloak(@Value("${iam.usermanagement.serverUrl}") String serverUrl, @Value("${iam.usermanagement.username}") String username, @Value("${iam.usermanagement.password}") String password) {
        log.info("Configure keycloak admin with serverUrl: {}", serverUrl);
        return KeycloakBuilder.builder()
                .serverUrl(serverUrl)
                .realm("fides")
                .clientId("fides-backend-api")
                .grantType(OAuth2Constants.PASSWORD)
                .username(username)
                .password(password)
                .build();
    }
}
