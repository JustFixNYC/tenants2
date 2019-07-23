--- zip code of building (pluto_18v2)
--- residential units in building (pluto_18v2) 
with Total_Res_Units as(
    select    
        zipcode,
        UnitsRes,
        bbl --is this necessary
    from pluto_18v2
    where bbl= %(bbl)s
    ),
    
--- sum of res units in associated portfolio (get_assoc_addrs_from_bbl)
--- count of buildings in associated portfolio (get_assoc_addrs_from_bbl) 
Count_Of_Assoc_Bldgs as (
    select  
		case 
			when bbl is not null then %(bbl)s
			else %(bbl)s
		end as Enteredbbl,  
        count(*) as NumberOfAssociatedBuildings,
        sum(unitsres) as NumberOfUnitsinPortfolio
    from get_assoc_addrs_from_bbl(%(bbl)s)
	group by ( Enteredbbl)
),
    
-- count of HPD complaints since 2014 in building (hpd_complaints)
--count of all complaints closed and open
Count_HPD as (
    select
        bbl,
        count(*) filter (where complaintid is not null) as NumberOfHPDcomplaints
    from public.hpd_complaints
    where bbl= %(bbl)s and receiveddate > '2014-01-01'
    group by bbl
    
),

-- count of open HPD violations in building (hpd_violations)
Count_Open_HPD as (
    select
        bbl,
        count(*) as NumberOfOpenHPDviolations
    from public.hpd_violations
    where bbl= %(bbl)s and violationstatus='Open'
    group by bbl
),

--- count of rent stab units in 2007 in building (rentstab_summary)
--- count of rent stab units in 2017 in building (rentstab_summary)
--- true/false of whether there were ever rent stab units in building (rentstab_summary)
Count_RS as (
    select
        ucbbl as bbl,
        unitsstab2007,
        unitsstab2017,
        case 
            when unitsstab2007=0 and unitsstab2017=0 then false
            else true
        end as RS_bool
        
    from rentstab_summary
    where ucbbl=%(bbl)s

)

select
    T.zipcode as zipcode,
    T.UnitsRes as unit_count,
    HPD.NumberOfHPDcomplaints as hpd_complaint_count,
    OpenHPD.NumberOfOpenHPDviolations as hpd_open_violation_count,
    RS.unitsstab2007 as stabilized_unit_count_2007,
    RS.unitsstab2017 as stabilized_unit_count_2017,
    RS.RS_bool as has_stabilized_units,
    A.NumberOfAssociatedBuildings as associated_building_count,
    A.NumberOfUnitsinPortfolio as portfolio_unit_count
from Total_Res_Units T
    left join Count_HPD HPD on T.bbl=HPD.bbl
    left join Count_Open_HPD OpenHPD on T.bbl=OpenHPD.bbl
    left join Count_RS RS on T.bbl=RS.bbl
    left join Count_Of_Assoc_Bldgs A on T.bbl= A.Enteredbbl
