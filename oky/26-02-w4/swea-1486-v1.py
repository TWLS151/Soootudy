# SWEA-1486 장훈이의 높은 선반


from itertools import combinations

T = int(input())

for test_case in range(1, T + 1):
    N, B = map(int, input().split())
    H = list(map(int, input().split()))

    H.sort()
    h_sum = 0
    flag = False

    for i in range(1, N):
        h_sum += H[i]
        
        if h_sum == B:
            flag = True
            break
        
        elif h_sum > B:
            min_cnt = i + 1
            break

    if flag:
        print(f'#{test_case} {0}')
        continue

    min_diff = sum(H) - B

    for j in range(1, min_cnt + 1):
        for c in combinations(H,j):
            diff = sum(c) - B
            if 0 <= diff < min_diff:
                min_diff = diff

    print(f'#{test_case} {min_diff}')
    