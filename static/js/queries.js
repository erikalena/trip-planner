export const queryPoi = `

     ?poi dbo:location ?city. 


    optional
    {
    ?poi a ?type.
    VALUES ?type {dbo:Museum}
    BIND( "Museum" as ?typeName )
    }


    optional
    {
    ?poi a ?type.
    VALUES ?type {yago:Church103028079}
    BIND( "Church" as ?typeName )
    }

    optional
    {
    ?poi a ?type.
    VALUES ?type {dbo:Road}
    BIND( "Road" as ?typeName )
    }

    optional
    {
    ?poi a ?type.
    VALUES ?type {dbo:ArchitecturalStructure}
    BIND( "Architectural Structure" as ?typeName )
    }

    filter (BOUND (?type))

    optional {
    ?poi foaf:name ?name. 
    }

    optional {
    ?poi geo:lat ?lat.
    ?poi geo:lat ?long.
    }


    optional {
    ?poi foaf:depiction ?img.
    }

}
`