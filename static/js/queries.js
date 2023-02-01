
const dbpediaQuery = `

    select ?poi (max(?name) as ?Name) ?typeName  (sample(?img ) as ?Image) ?lat ?long

    where {
        VALUES ?city {<http://dbpedia.org/resource/Bologna>} 
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
`;

