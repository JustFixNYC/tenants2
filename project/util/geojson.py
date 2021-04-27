from typing import List
import pydantic


class FeatureGeometry(pydantic.BaseModel):
    # This is generally "Point".
    type: str

    # The longitude and latitude (in that order).
    coordinates: List[float]
