from mangum import Mangum

from austin_surface_pros_api.main import app

handler = Mangum(app, lifespan="auto")
