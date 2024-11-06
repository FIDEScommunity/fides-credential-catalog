package community.fides.credentialcatalog.backend.rest.api;

import community.fides.credentialcatalog.backend.domain.CredentialKind;
import community.fides.credentialcatalog.backend.domain.DeploymentEnvironment;
import community.fides.credentialcatalog.backend.domain.IssuanceConfigCredentialType;
import community.fides.credentialcatalog.backend.rest.api.dto.CredentialTypeDto;
import community.fides.credentialcatalog.backend.service.IssuanceConfigCredentialTypePublicSearchService;
import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedModel;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController()
@RequestMapping("/api/public/credentialtype")
@Slf4j
@RequiredArgsConstructor
@PreAuthorize("permitAll()")

@OpenAPIDefinition(tags = @Tag(name = "Search API", description = "Search in the catalog"),
        info = @io.swagger.v3.oas.annotations.info.Info(
                title = "Credential Catalog API",
                version = "1.0",
                description = "API to search in the credential catalog",
                contact = @io.swagger.v3.oas.annotations.info.Contact(
                        url = "https://credential-catalog.fides.community",
                        name = "Fides Credential Catalog",
                        email = "catalog@fides.community"
                )
        )

)
@Tag(name = "Search API", description = "Search in the catalog")
public class SearchApiController {

    private final IssuanceConfigCredentialTypePublicSearchService issuanceConfigCredentialTypePublicSearchService;

    @Operation(summary = "Find all credential types based on the query parameters")
    @GetMapping
    public PagedModel<CredentialTypeDto> find(@RequestParam Optional<List<CredentialKind>> credentialKind,
                                              @RequestParam Optional<List<DeploymentEnvironment>> deploymentEnvironment,
                                              @RequestParam Optional<List<String>> grantTypesSupported,
                                              @RequestParam Optional<List<String>> credentialFormat,
                                              @RequestParam Optional<List<String>> cryptographicBindingMethodsSupported,
                                              @RequestParam Optional<List<String>> credentialSigningAlgValuesSupported,
                                              @RequestParam Optional<List<String>> localeSupported,
                                              @RequestParam(defaultValue = "false") Boolean includeAllDetails,
                                              @ParameterObject @PageableDefault(value = 200) Pageable pageable) {
        final Page<IssuanceConfigCredentialType> items = issuanceConfigCredentialTypePublicSearchService.findAllPublic("",
                                                                                                                       grantTypesSupported,
                                                                                                                       credentialFormat,
                                                                                                                       credentialKind,
                                                                                                                       cryptographicBindingMethodsSupported,
                                                                                                                       deploymentEnvironment,
                                                                                                                       credentialSigningAlgValuesSupported,
                                                                                                                       localeSupported,
                                                                                                                       pageable);
        return new PagedModel(items.map(credentialType -> CredentialTypeDto.from(credentialType, includeAllDetails)));

    }

}
