create table issuance_url_log
(
    id                int auto_increment primary key,
    issuance_url      varchar(512) not null,
    organization_name varchar(255) not null,
    created_by        varchar(255) not null,
    created_at        timestamp    not null
);

create index issuance_url_log_url_uindex
    on issuance_url_log (issuance_url);

