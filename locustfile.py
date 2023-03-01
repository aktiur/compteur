from locust import HttpUser, task, constant
from requests.cookies import RequestsCookieJar


class HonestUser(HttpUser):
    weight = 20

    wait_time = constant(5)

    @task
    def incr(self):
        self.client.post("/incr")

    @task(10)
    def val(self):
        self.client.get("/val")


class Pirate(HttpUser):
    weight = 1

    @task
    def incr(self):
        # on vide les cookies
        self.client.cookies = RequestsCookieJar()
        self.client.post("/incr")
