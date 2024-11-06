package community.fides.credentialcatalog.backend.rest.webpublic;

import community.fides.credentialcatalog.backend.repository.IssuanceConfigCredentialTypeRepository;
import community.fides.credentialcatalog.backend.repository.IssuanceConfigRepository;
import community.fides.credentialcatalog.backend.rest.webpublic.dto.StaticDataDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController()
@RequestMapping("/api/webpublic/staticdata")
@Slf4j
@RequiredArgsConstructor
@PreAuthorize("permitAll()")
public class StaticDataController {

    private final IssuanceConfigRepository issuanceConfigRepository;
    private final IssuanceConfigCredentialTypeRepository issuanceConfigCredentialTypeRepository;

    @GetMapping
    public StaticDataDto get() {
        return StaticDataDto.builder()
                .grantTypesSupported(issuanceConfigRepository.getUniqueGrantTypesSupported())
                .credentialFormat(issuanceConfigCredentialTypeRepository.getUniqueCredentialFormats())
                .cryptographicBindingMethodsSupported(issuanceConfigCredentialTypeRepository.getUniqueCryptographicBindingMethodsSupported())
                .credentialSigningAlgValuesSupported(issuanceConfigCredentialTypeRepository.getUniqueCredentialSigningAlgValuesSupported())
                .locale(issuanceConfigCredentialTypeRepository.getUniqueLocales().stream()
                                .filter(locale -> locale != null)
                                .filter(locale -> !locale.trim().isEmpty())
                                .toList()
                )
                .build();
    }


}
