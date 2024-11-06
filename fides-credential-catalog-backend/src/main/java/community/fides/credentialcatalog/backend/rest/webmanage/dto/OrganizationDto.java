package community.fides.credentialcatalog.backend.rest.webmanage.dto;

import community.fides.credentialcatalog.backend.domain.Organization;
import java.util.Collections;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class OrganizationDto {

    private Long id;
    private String name;


    public static List<OrganizationDto> from(List<Organization> organizations) {
        if (organizations == null) {
            return Collections.emptyList();
        }
        return organizations.stream().map(OrganizationDto::from).toList();
    }

    public static OrganizationDto from(Organization organization) {
        if (organization == null) {
            return null;
        }
        return OrganizationDto.builder()
                .id(organization.getId())
                .name(organization.getName())
                .build();
    }
}


