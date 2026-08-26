import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import Button from "components/Button";
import { useTranslation } from "react-i18next";
const ErrorPage = () => {
  const goBack = () => {
    window.location.href = "/dashboard";
  };
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>{t("error")}</title>
      </Helmet>
      <div className="h-screen overflow-hidden">
        <div className="flex items-stretch justify-center">
          <div className="h-screen overflow-auto flex items-center justify-center py-12 px-6">
            <div className="w-full mx-auto text-center">
              <h1 className="text-2xl mb-5">{t("oops_wrong")}</h1>
              <Link to="/dashboard">
                <Button
                  btn="primary"
                  onClick={goBack}
                  title={t("go_back")}
                  className="!w-auto px-8"
                />{" "}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ErrorPage;
