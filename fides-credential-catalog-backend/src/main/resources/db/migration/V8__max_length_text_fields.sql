alter table issuance_config
    modify issuance_content mediumtext null;

alter table issuance_config
    modify name varchar(255) null;

alter table issuance_config_credential_type
    modify search_data mediumtext null;

