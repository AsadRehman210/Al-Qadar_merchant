import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { Helmet } from "react-helmet";
import Profile from "./Profile";
import Security from "./Security";

const UserProfile = () => {
  return (
    <>
      <Helmet>
        <title>Rafeeqi | Add Company</title>
      </Helmet>
      <TabGroup className="">
        <div className="overflow-x-auto mb-4">
          <TabList className="inline-flex overflow-x-auto items-center justify-center gap-6 bg-[#E2E7EF] p-1.5 rounded-lg">
            <Tab className="min-w-[143px] px-[45px] whitespace-nowrap rounded-lg h-[38px] text-[#96A1B1] flex justify-center items-center data-[selected]:bg-white outline-none data-[selected]:text-black data-[selected]:font-medium">
              Profile
            </Tab>
            <Tab className="min-w-[143px] px-[45px] whitespace-nowrap rounded-lg h-[38px] text-[#96A1B1] flex justify-center items-center data-[selected]:bg-white outline-none data-[selected]:text-black data-[selected]:font-medium">
              Security
            </Tab>
          </TabList>
        </div>
        <div className="rounded-lg bg-white p-14">
          <TabPanels className="grow">
            <TabPanel>
              <Profile />
            </TabPanel>
            <TabPanel>
              <Security />
            </TabPanel>
          </TabPanels>
        </div>
      </TabGroup>
    </>
  );
};

export default UserProfile;
