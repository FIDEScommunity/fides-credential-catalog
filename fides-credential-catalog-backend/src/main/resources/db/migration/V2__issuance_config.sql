create table issuance_config
(
    id              int auto_increment primary key,
    organization_id int          not null,
    issuance_url    varchar(512) not null,
    deployment_environment            varchar(20)  not null,
    visibility_status                 varchar(20)  not null,
    supported_open_id4vc_spec_version varchar(20)  not null,
    created_at                        timestamp    not null,
    created_by                        varchar(255) not null,
    updated_at      timestamp    not null,
    updated_by                        varchar(255) not null,
    foreign key (organization_id) references organization (id)
);

create unique index issuance_config_url
    on issuance_config (issuance_url);

