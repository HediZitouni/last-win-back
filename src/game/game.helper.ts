export function generateGameTag(size: number) {
  return [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");
}

export const addNameInUserAggregation = {
  $addFields: {
    users: {
      $map: {
        input: "$users",
        as: "user",
        in: {
          idUser: "$$user.idUser",
          ready: "$$user.ready",
          credit: "$$user.credit",
          score: "$$user.score",
          name: {
            $arrayElemAt: [
              "$usersData.name",
              {
                $indexOfArray: ["$usersData._id", "$$user.idUser"],
              },
            ],
          },
        },
      },
    },
  },
};
