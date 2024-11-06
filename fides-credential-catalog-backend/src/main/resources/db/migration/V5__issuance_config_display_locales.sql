create table ic_issuer_display_locale
(
    id                    int auto_increment primary key,
    issuance_config_id    int     not null,
    issuer_display_locale char(5) not null,
    foreign key (issuance_config_id) references issuance_config (id) ON DELETE CASCADE
)
