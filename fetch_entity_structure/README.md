This script generates `icatEntityStructure.ts`, which contains a mapping of all ICAT entities to their fields. This makes it possible to set values for fields that aren't included on any entities returned by the ICAT server - see the original issue [here](https://github.com/WHTaylor/icat-admin/issues/34).

 - Fields are either 'attributes', scalar values, or 'related entities', entities of a different type that have a relationship to the origin entity
   - Related entities can either be 'ones', meaning there's at most one of them (e.g. investigation.facility), or 'manys', meaning there can be many (e.g. investigation.datasets)
 - All of the information is pulled from the ICAT server provided as an argument when running the script. This means that only a single version of ICAT is supported at any given time; to improve this, we may want to make it possible to have multiple mappings, and switch which one is in use at runtime based on the `/version` endpoint of the connected server
