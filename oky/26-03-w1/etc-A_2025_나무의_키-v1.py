# A형 기출(2025) 나무의 키


T = int(input())

for test_case in range(1, T + 1):
    N = int(input())
    trees = list(map(int, input().split()))


    # 경우 1
    goal_1 = max(trees)
    even_cnt = 0
    odd_cnt = 0

    for tree in trees:
        even_cnt += (goal_1 - tree) // 2
        odd_cnt += (goal_1 - tree) % 2

    while even_cnt > odd_cnt + 1:
        even_cnt -= 1
        odd_cnt += 2

    if even_cnt >= odd_cnt:
        result_1 = even_cnt * 2
    else:
        result_1 = odd_cnt * 2 - 1


    # 경우 2
    goal_2 = max(trees) + 1
    even_cnt = 0
    odd_cnt = 0

    for tree in trees:
        even_cnt += (goal_2 - tree) // 2
        odd_cnt += (goal_2 - tree) % 2

    while even_cnt > odd_cnt + 1:
        even_cnt -= 1
        odd_cnt += 2

    if even_cnt >= odd_cnt:
        result_2 = even_cnt * 2
    else:
        result_2 = odd_cnt * 2 - 1

    """
    # [WRONG]
    day_cnt = 0
    left_cnt = [0, 0, 0]

    for tree in trees:
        day_cnt += ((goal - tree) // 3) * 2
        left = (goal - tree) % 3
        left_cnt[left] += 1

    if left_cnt[1] > left_cnt[2]:
        result = day_cnt + left_cnt[1] * 2 - 1
    else:
        result = day_cnt + left_cnt[2] * 2
    """

    print(f'#{test_case} {min(result_1, result_2)}')
