create table organization
(
    id                    int auto_increment primary key,
    external_key          char(36)      not null,
    name                  varchar(100)  not null,
    support_email_address varchar(255) not null,
    api_key               varchar(100) not null
);

create unique index organization_external_key_uindex
    on organization (external_key);

