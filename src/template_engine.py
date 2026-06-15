class TemplateEngine:

    def __init__(self, data):
        self.templates = data.templates

    def search(self, keyword: str):

        keyword = keyword.lower()

        results = []

        for item in self.templates:

            title = str(
                item.get("Title", "")
            )

            if keyword in title.lower():

                results.append(
                    item
                )

        return results