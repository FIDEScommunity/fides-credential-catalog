alter table issuance_config_credential_type
    add search_data text null;

alter table issuance_config_credential_type
    add credential_format varchar(20) null;

create table ct_cryptographic_binding_methods_supported
(
    id                                      int auto_increment primary key,
    issuance_config_credential_type_id      int          not null,
    cryptographic_binding_methods_supported varchar(255) not null,
    foreign key (issuance_config_credential_type_id) references issuance_config_credential_type (id) ON DELETE CASCADE
);

create table ct_credential_signing_alg_values_supported
(
    id                                      int auto_increment primary key,
    issuance_config_credential_type_id      int         not null,
    credential_signing_alg_values_supported varchar(50) not null,
    foreign key (issuance_config_credential_type_id) references issuance_config_credential_type (id) ON DELETE CASCADE
);

create table ct_locale
(
    id                                 int auto_increment primary key,
    issuance_config_credential_type_id int         not null,
    locale                             varchar(10) not null,
    foreign key (issuance_config_credential_type_id) references issuance_config_credential_type (id) ON DELETE CASCADE
);

create table ic_grant_types_supported
(
    id                    int auto_increment primary key,
    issuance_config_id    int          not null,
    grant_types_supported varchar(255) not null,
    foreign key (issuance_config_id) references issuance_config (id) ON DELETE CASCADE
)
