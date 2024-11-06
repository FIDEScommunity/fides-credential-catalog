alter table issuance_config
    add issuance_content text null;
alter table issuance_config
    add name text null;


create table issuance_config_credential_type
(
    id                          int auto_increment primary key,
    issuance_config_id          int not null,
    credential_configuration_id varchar(255),
    credential_kind             varchar(20),
    default_display_locale      varchar(10),
    schema_url                  varchar(512),
    schema_info                 text,
    trust_framework_url         varchar(512),
    trust_framework_info        text,
    documentation_url           varchar(512),
    documentation_info          text,
    foreign key (issuance_config_id) references issuance_config (id)
);

create unique index iss_conf_cred_type_config_id
    on issuance_config_credential_type (issuance_config_id, credential_configuration_id);


