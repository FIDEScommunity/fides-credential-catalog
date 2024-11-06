package community.fides.credentialcatalog.backend.configuration;

import community.fides.credentialcatalog.backend.configuration.security.ApiKeyAuthenticationFilter;
import community.fides.credentialcatalog.backend.configuration.security.CustomJwtAuthenticationConverter;
import community.fides.credentialcatalog.backend.configuration.security.SelectiveBearerTokenResolver;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@Slf4j
public class SecurityConfig {

    @Autowired
    private ApiKeyAuthenticationFilter apiKeyAuthenticationFilter;

    @Autowired
    private CustomJwtAuthenticationConverter customJwtAuthenticationConverter;

    @Autowired
    private SelectiveBearerTokenResolver selectiveBearerTokenResolver;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health/**").permitAll()
                        .requestMatchers("/api/webpublic/**").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        .anyRequest().authenticated())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(apiKeyAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .oauth2ResourceServer(oauth2 -> {
                    oauth2.jwt(jwtConfigurer -> jwtConfigurer.jwtAuthenticationConverter(customJwtAuthenticationConverter));
                    oauth2.bearerTokenResolver(request -> selectiveBearerTokenResolver.resolve(request));
                })
                .build();
    }
}
