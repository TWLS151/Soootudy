

T = int(input())

for tc in range(1, T + 1):
    N, W1, W2 = map(int, input().split())
    k = list(map(int, input().split()))

    # 각 탑의 층수 정보를 하나의 리스트로 통합
    floor = list(range(1, W1 + 1)) + list(range(1, W2 + 1))

    # 낮은 층수일수록 비용이 적게 들므로 floor는 오름차순 정렬
    # 무거운 화물일수록 낮은 층에 놓아야 하므로 k는 내림차순 정렬
    floor.sort()
    k.sort(reverse=True)

    # 두 리스트를 순서대로 곱하여 합산
    sum_cost = 0
    for i in range(N):
        sum_cost += floor[i] * k[i]
    """
    # zip 함수 활용 시
    for f, w in zip(floor, k):
    sum_cost += f * w
    """
    
    print(f'#{tc} {sum_cost}')