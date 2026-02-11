T = int(input())
for tc in range(1, T + 1):  # 테스트 케이스의 개수
    N, W1, W2 = map(int, input().split())
    # 내림차순으로 화물의 무게를 입력받는다
    cargo_list = sorted(list(map(int, input().split())), reverse=True)
    print(cargo_list)
    W1_list = []
    W2_list = []
    sum = 0
    # W1과 W2에 격자로 하나씩 넣는것이 가장 비용 적음
    if W1 > W2:
        for i in range(len(cargo_list)):
            # 격자로 화물을 넣고 만약 다 차면 높은곳에 나머지 넣음
            if i % 2 == 0 and len(W2_list) < W2:
                W2_list.append(cargo_list[i])
            else:
                W1_list.append(cargo_list[i])

    else:
        for i in range(len(cargo_list)):
            if i % 2 == 0 and len(W1_list) < W1:
                W1_list.append(cargo_list[i])
            else:
                W2_list.append(cargo_list[i])

    floor = 1
    for j in W1_list:
        # 층 수 * 화물의 무게 모두 더함
        sum += j * floor
        floor += 1

    floor = 1
    for j in W2_list:
        sum += j * floor
        floor += 1

    print(sum)
