package community.fides.credentialcatalog.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(exclude = {SecurityAutoConfiguration.class, UserDetailsServiceAutoConfiguration.class})
@EnableScheduling
@EnableAsync
@EntityScan(basePackageClasses = CredentialCatalogBackendApplication.class)
@EnableConfigurationProperties
@ConfigurationPropertiesScan
public class CredentialCatalogBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(CredentialCatalogBackendApplication.class, args);
    }
}
