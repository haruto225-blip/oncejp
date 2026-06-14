-- Temporarily remove the foreign key so events can be created with a dummy host_id
-- before real user authentication is wired up. host_id remains a plain uuid column.
alter table events drop constraint events_host_id_fkey;
