import React from "react";

/**
 * A simple Hello World view component that demonstrates basic layout and styling
 */
const HelloWorld = () => {
  return (
    <main className="min-h-screen bg-wash p-4 md:p-6 lg:p-8">
      <section className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-primary-dark font-serif">
              Hello World
            </h1>
          </div>
          <div>
            <p className="text-neutral">
              Welcome to your new Tonk application!
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HelloWorld;
