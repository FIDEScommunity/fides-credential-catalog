package community.fides.credentialcatalog.backend.service;

import community.fides.credentialcatalog.backend.configuration.security.LocalPrincipal;
import community.fides.credentialcatalog.backend.domain.CredentialKind;
import community.fides.credentialcatalog.backend.domain.DeploymentEnvironment;
import community.fides.credentialcatalog.backend.domain.IssuanceConfigCredentialType;
import community.fides.credentialcatalog.backend.domain.VisibilityStatus;
import community.fides.credentialcatalog.backend.repository.IssuanceConfigCredentialTypeRepository;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import static java.util.List.of;

@Service
@RequiredArgsConstructor
public class IssuanceConfigCredentialTypePublicSearchService {

    private final IssuanceConfigCredentialTypeRepository issuanceConfigCredentialTypeRepository;

    @Transactional(readOnly = true)
    public Page<IssuanceConfigCredentialType> findAllPublic(String searchText,
                                                            final Optional<List<String>> grantTypesSupported,
                                                            final Optional<List<String>> credentialFormat,
                                                            final Optional<List<CredentialKind>> credentialKinds,
                                                            final Optional<List<String>> cryptographicBindingMethodsSupported,
                                                            final Optional<List<DeploymentEnvironment>> deploymentEnvironment,
                                                            final Optional<List<String>> credentialSigningAlgValuesSupported,
                                                            final Optional<List<String>> localeSupported,
                                                            Pageable pageable) {
        var allSpecification = new ArrayList<Specification<IssuanceConfigCredentialType>>();
        allSpecification.add(issuanceConfigCredentialTypeRepository.hasVisibilityStatus(of(VisibilityStatus.PUBLIC)));
        if (deploymentEnvironment.isPresent() && !deploymentEnvironment.get().isEmpty()) {
            allSpecification.add(issuanceConfigCredentialTypeRepository.hasDeploymentEnvironment(deploymentEnvironment.get()));
        }
        if (grantTypesSupported.isPresent() && !grantTypesSupported.get().isEmpty()) {
            allSpecification.add(issuanceConfigCredentialTypeRepository.hasGrantTypesSupported(grantTypesSupported.get()));
        }
        if (credentialFormat.isPresent() && !credentialFormat.get().isEmpty()) {
            allSpecification.add(issuanceConfigCredentialTypeRepository.hasCredentialFormat(credentialFormat.get()));
        }
        if (credentialSigningAlgValuesSupported.isPresent() && !credentialSigningAlgValuesSupported.get().isEmpty()) {
            allSpecification.add(issuanceConfigCredentialTypeRepository.hasCredentialSigningAlgValuesSupported(credentialSigningAlgValuesSupported.get()));
        }
        if (cryptographicBindingMethodsSupported.isPresent() && !cryptographicBindingMethodsSupported.get().isEmpty()) {
            allSpecification.add(issuanceConfigCredentialTypeRepository.hasCryptographicBindingMethodsSupported(cryptographicBindingMethodsSupported.get()));
        }
        if (localeSupported.isPresent() && !localeSupported.get().isEmpty()) {
            allSpecification.add(issuanceConfigCredentialTypeRepository.hasLocale(localeSupported.get()));
        }
        if (credentialKinds.isPresent() && !credentialKinds.get().isEmpty()) {
            allSpecification.add(issuanceConfigCredentialTypeRepository.hasCredentialKind(credentialKinds.get()));
        }
        if (!searchText.isEmpty()) {
            allSpecification.addAll(
                    Arrays.stream(searchText.split(" "))
                            .map(text -> issuanceConfigCredentialTypeRepository.containsSearchText(text)
                                    .or(issuanceConfigCredentialTypeRepository.containsDescription(text)))
                            .toList()
            );
        }
        final Specification<IssuanceConfigCredentialType> specification = issuanceConfigCredentialTypeRepository.allOf(allSpecification);
        return issuanceConfigCredentialTypeRepository.findAll(specification, pageable);

    }


    public Optional<IssuanceConfigCredentialType> findById(final LocalPrincipal principal, final Long id) {
        return issuanceConfigCredentialTypeRepository.findByIdAndIssuanceConfig_visibilityStatus(id, VisibilityStatus.PUBLIC);
    }
}
